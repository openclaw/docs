---
read_when:
    - Necesitas un recorrido exacto del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolado de sesiones, las escrituras de transcripción o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-06-27T11:08:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución "real" completa de un agente: recepción → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, manteniendo coherente el estado de la sesión.

En OpenClaw, un bucle es una única ejecución serializada por sesión que emite eventos de ciclo de vida y de flujo
mientras el modelo razona, llama herramientas y transmite salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida parámetros, resuelve la sesión (sessionKey/sessionId), persiste metadatos de sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve el modelo y los valores predeterminados de thinking/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedAgent` (runtime de agente de OpenClaw)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedAgent`:
   - serializa ejecuciones mediante colas por sesión y globales
   - resuelve el modelo y el perfil de autenticación y construye la sesión de OpenClaw
   - se suscribe a eventos del runtime y transmite deltas de asistente/herramienta
   - aplica timeout -> aborta la ejecución si se supera
   - para turnos del servidor de aplicaciones de Codex, aborta un turno aceptado que deja de producir progreso del servidor de aplicaciones antes de un evento terminal
   - devuelve payloads y metadatos de uso
4. `subscribeEmbeddedAgentSession` conecta eventos del runtime de agente al flujo `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas de asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Encolado + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global.
- Esto evita carreras de herramientas/sesión y mantiene coherente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (steer/followup/collect/interrupt) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión sobre el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivo, por lo que captura escritores que omiten la cola en proceso o vienen de
  otro proceso. Los escritores de transcripción de sesión esperan hasta `session.writeLock.acquireTimeoutMs`
  antes de informar que la sesión está ocupada; el valor predeterminado es `60000` ms.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras preserva un único escritor lógico, debe habilitarlo explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones con sandbox pueden redirigirse a una raíz de espacio de trabajo sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura de transcripción, Compaction o truncamiento debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y las anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver lo que recibe el modelo.

## Puntos de hook (dónde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts dirigidos por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de bootstrap antes de finalizar el prompt del sistema.
  Úsalo para agregar/quitar archivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta la documentación de Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + Gateway)

Estos se ejecutan dentro del bucle del agente o la canalización de Gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular de forma determinista el proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para orientación estable que debe residir en el espacio del prompt del sistema.
- **`before_agent_start`**: hook de compatibilidad heredado que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones inline y antes de la llamada al LLM, lo que permite que un Plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona material preparado de instalación de skill o Plugin después de que se ejecuta la política de instalación del operador, cuando los hooks de Plugin están cargados en el proceso actual de OpenClaw.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes y salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos del ciclo de vida de Gateway.

Reglas de decisión de hooks para protecciones de salida/herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` es una no-op y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_install`: `{ block: false }` es una no-op y no borra un bloqueo previo.
- Usa `security.installPolicy`, no `before_install`, para decisiones de permitir/bloquear instalaciones propiedad del operador que deben cubrir rutas de instalación y actualización de CLI.
- `message_sending`: `{ cancel: true }` es terminal y detiene handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` es una no-op y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los arneses pueden adaptar estos hooks de forma diferente. El arnés de servidor de aplicaciones de Codex mantiene
los hooks de Plugin de OpenClaw como el contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo separado de Codex de nivel inferior.

## Streaming + respuestas parciales

- Los deltas de asistente se transmiten desde el runtime del agente y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales ya sea en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un flujo separado o como respuestas de bloque.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas de bloque.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el flujo `tool`.
- Los resultados de herramientas se saneán por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado de respuesta + supresión

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas inline (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los
  payloads salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta falló, se emite una respuesta de error de herramienta de respaldo
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de flujo `compaction` y puede activar un reintento.
- En el reintento, los buffers en memoria y los resúmenes de herramientas se reinician para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la canalización de Compaction.

## Flujos de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedAgentSession` (y como respaldo por `agentCommand`)
- `assistant`: deltas transmitidos desde el runtime del agente
- `tool`: eventos de herramientas transmitidos desde el runtime del agente

## Manejo de canal de chat

- Los deltas de asistente se almacenan en buffer como mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado 172800 s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedAgent`.
- Runtime de Cron: el `timeoutSeconds` de turno de agente aislado pertenece a cron. El planificador inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en el plazo configurado y luego ejecuta limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar el carril atascado.
- Diagnósticos de actividad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen respuesta, herramienta, estado, bloque ni progreso de ACP observado. Las ejecuciones embebidas activas, las llamadas al modelo y las llamadas de herramientas se informan como `session.long_running`; las llamadas silenciosas al modelo con propietario también permanecen como `session.long_running` hasta `diagnostics.stuckSessionAbortMs` para que los proveedores lentos o sin streaming no se informen como detenidos demasiado pronto. El trabajo activo sin progreso reciente se informa como `session.stalled`; las llamadas al modelo con propietario cambian a `session.stalled` en o después del umbral de aborto, y la actividad obsoleta de modelo/herramienta sin propietario no se oculta como de larga duración. `session.stuck` se reserva para contabilidad de sesiones obsoletas recuperables, incluidas sesiones en cola inactivas con actividad obsoleta de modelo/herramienta sin propietario. La contabilidad de sesiones obsoletas libera el carril de sesión afectado inmediatamente después de que pasan las compuertas de recuperación; las ejecuciones embebidas detenidas solo se abortan y drenan después de `diagnostics.stuckSessionAbortMs` (valor predeterminado: al menos 5 minutos y 3x el umbral de advertencia) para que el trabajo en cola pueda reanudarse sin cortar ejecuciones simplemente lentas. La recuperación emite resultados estructurados solicitados/completados, y el estado de diagnóstico se marca como inactivo solo si la misma generación de procesamiento sigue siendo la actual. Los diagnósticos `session.stuck` repetidos aplican backoff mientras la sesión permanece sin cambios.
- Timeout de inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos, pero sigue estando acotado por cualquier `agents.defaults.timeoutSeconds` menor o timeout específico de ejecución porque esos controlan toda la ejecución del agente. De lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s de forma predeterminada. Las ejecuciones de modelos en la nube activadas por Cron sin timeout explícito de modelo o agente usan el mismo watchdog de inactividad predeterminado; con un timeout explícito de ejecución de Cron, las detenciones de flujo de modelos en la nube se limitan a 60 s para que los fallbacks de modelo configurados puedan ejecutarse antes del plazo externo de Cron. Las ejecuciones de modelos locales o autohospedados activadas por Cron deshabilitan el watchdog implícito a menos que se configure un timeout explícito, y los timeouts explícitos de ejecución de Cron siguen siendo la ventana de inactividad para proveedores locales/autohospedados, por lo que los proveedores locales lentos deben establecer `models.providers.<id>.timeoutSeconds`.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las fetches HTTP de modelo de ese proveedor, incluidos conexión, headers, body, timeout de solicitud del SDK, manejo de aborto total de guarded-fetch y watchdog de inactividad de flujo del modelo. Usa esto para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout de todo el runtime del agente, y mantén el timeout del agente/runtime al menos igual de alto cuando la solicitud de modelo necesite ejecutarse durante más tiempo.

## Dónde las cosas pueden terminar antes

- Tiempo de espera del agente (anulación)
- AbortSignal (cancelación)
- Desconexión del Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene al agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts basados en eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de exec](/es/tools/exec-approvals) — controles de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración del nivel de pensamiento/razonamiento
