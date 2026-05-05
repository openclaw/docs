---
read_when:
    - Necesitas un recorrido exacto del bucle del agente o de los eventos del ciclo de vida
    - Está cambiando la puesta en cola de sesiones, las escrituras de transcripción o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-05-05T05:22:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, manteniendo coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de flujo
mientras el modelo piensa, llama herramientas y transmite salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. La RPC `agent` valida parámetros, resuelve la sesión (sessionKey/sessionId), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve valores predeterminados de modelo + razonamiento/detallado/traza
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica el timeout -> aborta la ejecución si se excede
   - para turnos del servidor de aplicaciones de Codex, aborta un turno aceptado que deja de producir progreso del servidor de aplicaciones antes de un evento terminal
   - devuelve payloads + metadatos de uso
4. `subscribeEmbeddedPiSession` puentea eventos de pi-agent-core al stream `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global.
- Esto evita condiciones de carrera de herramientas/sesión y mantiene coherente el historial de la sesión.
- Los canales de mensajería pueden elegir modos de cola (recopilar/dirigir/seguimiento) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión sobre el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivo, por lo que detecta escritores que omiten la cola en proceso o vienen de
  otro proceso. Los escritores de transcripción de sesión esperan hasta `session.writeLock.acquireTimeoutMs`
  antes de informar que la sesión está ocupada; el valor predeterminado es `60000` ms.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras conserva un único escritor lógico, debe optar explícitamente por
  `allowReentrant: true`.

## Preparación de sesión + workspace

- El workspace se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de workspace de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de arranque/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y prepara antes del streaming. Cualquier
  reescritura, Compaction o truncamiento posterior de la transcripción debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de arranque y las sobrescrituras por ejecución.
- Se aplican límites específicos del modelo y tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver qué ve el modelo.

## Puntos de hook (donde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts impulsados por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y el pipeline de gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de arranque antes de finalizar el prompt del sistema.
  Úsalo para agregar/eliminar archivos de contexto de arranque.
- **Hooks de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta la documentación de Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + gateway)

Estos se ejecutan dentro del bucle del agente o el pipeline de gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para sobrescribir determinísticamente proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para guía estable que debe ubicarse en el espacio del prompt del sistema.
- **`before_agent_start`**: hook heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones inline y antes de la llamada al LLM, permitiendo que un Plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos del escaneo integrado y opcionalmente bloquea instalaciones de Skills o Plugin.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida de gateway.

Reglas de decisión de hooks para guardias salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` es un no-op y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_install`: `{ block: false }` es un no-op y no borra un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` es un no-op y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y detalles de registro.

Los harnesses pueden adaptar estos hooks de forma diferente. El harness del servidor de aplicaciones de Codex mantiene
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies documentadas reflejadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo Codex de nivel inferior separado.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un stream separado o como respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas por bloques.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramientas se emiten en el stream `tool`.
- Los resultados de herramientas se sanitizan por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Formato de respuesta + supresión

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes inline de herramientas (cuando detallado + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los
  payloads salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta produjo error, se emite una respuesta alternativa de error de herramienta
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En un reintento, los búferes en memoria y los resúmenes de herramientas se reinician para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para el pipeline de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como fallback por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramientas transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en búfer como mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30s (solo la espera). El parámetro `timeoutMs` lo sobrescribe.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado de 172800s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: el `timeoutSeconds` de turno de agente aislado lo posee cron. El scheduler inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en el plazo configurado y luego ejecuta limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar el carril bloqueado.
- Diagnósticos de vivacidad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen progreso observado de respuesta, herramienta, estado, bloque o ACP. Las ejecuciones embebidas activas, llamadas de modelo y llamadas de herramienta se reportan como `session.long_running`; el trabajo activo sin progreso reciente se reporta como `session.stalled`; `session.stuck` se reserva para contabilidad de sesión obsoleta sin trabajo activo. La contabilidad de sesión obsoleta libera inmediatamente el carril de sesión afectado; las ejecuciones embebidas detenidas se abortan y drenan solo después de `diagnostics.stuckSessionAbortMs` (predeterminado: al menos 10 minutos y 5x el umbral de advertencia) para que el trabajo en cola pueda reanudarse sin cortar ejecuciones meramente lentas. La recuperación emite resultados estructurados solicitados/completados, y el estado de diagnóstico se marca inactivo solo si la misma generación de procesamiento sigue vigente. Los diagnósticos `session.stuck` repetidos aplican backoff mientras la sesión permanece sin cambios.
- Timeout de inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120s de forma predeterminada. Las ejecuciones activadas por Cron sin timeout explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de cron.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las solicitudes HTTP de modelo de ese proveedor, incluyendo conexión, headers, body, timeout de solicitud del SDK, manejo total de aborto de guarded-fetch y watchdog de inactividad del stream del modelo. Úsalo para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout completo del runtime del agente.

## Dónde pueden terminar antes las cosas

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts impulsados por eventos activados por eventos de ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen conversaciones largas
- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Razonamiento](/es/tools/thinking) — configuración del nivel de pensamiento/razonamiento
