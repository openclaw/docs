---
read_when:
    - Necesita una guía paso a paso exacta del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolamiento de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-04-30T18:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, manteniendo coherente el estado de la sesión.

En OpenClaw, un bucle es una única ejecución serializada por sesión que emite eventos de ciclo de vida y de flujo
mientras el modelo razona, llama a herramientas y transmite la salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida los parámetros, resuelve la sesión (sessionKey/sessionId), persiste los metadatos de sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve el modelo y los valores predeterminados de pensamiento/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle incrustado no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión y globales
   - resuelve el modelo y el perfil de autenticación, y construye la sesión de pi
   - se suscribe a eventos de pi y transmite deltas de asistente/herramienta
   - aplica timeout -> aborta la ejecución si se supera
   - para turnos del app-server de Codex, aborta un turno aceptado que deja de producir progreso de app-server antes de un evento terminal
   - devuelve payloads y metadatos de uso
4. `subscribeEmbeddedPiSession` conecta eventos de pi-agent-core con el flujo `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y, opcionalmente, mediante un carril global.
- Esto evita carreras de herramientas/sesión y mantiene coherente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es
  consciente del proceso y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras conserva un único escritor lógico, debe optar por ello explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo de sandbox.
- Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura, Compaction o truncamiento de la transcripción debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver lo que recibe el modelo.

## Puntos de enlace (dónde puedes interceptar)

OpenClaw tiene dos sistemas de enlaces:

- **Enlaces internos** (enlaces de Gateway): scripts basados en eventos para comandos y eventos de ciclo de vida.
- **Enlaces de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de gateway.

### Enlaces internos (enlaces de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen los archivos de bootstrap antes de finalizar el prompt del sistema.
  Usa esto para añadir/eliminar archivos de contexto de bootstrap.
- **Enlaces de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comandos (consulta el documento de enlaces).

Consulta [Enlaces](/es/automation/hooks) para la configuración y ejemplos.

### Enlaces de Plugin (ciclo de vida de agente + gateway)

Estos se ejecutan dentro del bucle del agente o la canalización de gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular de forma determinista el proveedor/modelo antes de resolver el modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes de enviar el prompt. Usa `prependContext` para texto dinámico por turno y los campos de contexto del sistema para orientación estable que debe ubicarse en el espacio del prompt del sistema.
- **`before_agent_start`**: enlace heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los enlaces explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones en línea y antes de la llamada al LLM, permitiendo que un Plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y opcionalmente bloquea instalaciones de Skill o Plugin.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: enlaces de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos del ciclo de vida de gateway.

Reglas de decisión de enlaces para protecciones salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` no tiene efecto y no elimina un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_install`: `{ block: false }` no tiene efecto y no elimina un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene los handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` no tiene efecto y no elimina una cancelación previa.

Consulta [Enlaces de Plugin](/es/plugins/hooks) para la API de enlaces y los detalles de registro.

Los harnesses pueden adaptar estos enlaces de forma diferente. El harness del app-server de Codex mantiene
los enlaces de Plugin de OpenClaw como contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los enlaces nativos de Codex siguen siendo un mecanismo Codex de nivel inferior separado.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un flujo separado o como respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas por bloques.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el flujo `tool`.
- Los resultados de herramientas se saneean por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado + supresión de respuestas

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas en línea (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los payloads
  salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta falló, se emite una respuesta de error de herramienta de respaldo
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de flujo `compaction` y puede activar un reintento.
- En el reintento, los búferes en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la canalización de Compaction.

## Flujos de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como respaldo por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramienta transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en búfer como mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado 172800 s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: el `timeoutSeconds` aislado del turno de agente pertenece a cron. El planificador inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en la fecha límite configurada y luego ejecuta limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar el carril atascado.
- Recuperación de sesiones atascadas: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` detecta sesiones largas en estado `processing`. Las ejecuciones incrustadas activas, las operaciones de respuesta activas y las tareas activas del carril de sesión permanecen solo como advertencias de forma predeterminada; si los diagnósticos no muestran trabajo activo para la sesión, el watchdog libera el carril de sesión afectado para que el trabajo de arranque en cola pueda drenarse.
- Timeout por inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s de forma predeterminada. Las ejecuciones activadas por Cron sin timeout explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de cron.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a los fetches HTTP del modelo de ese proveedor, incluyendo conexión, encabezados, cuerpo, timeout de solicitud del SDK, manejo de aborto total de guarded-fetch y watchdog de inactividad del flujo del modelo. Usa esto para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout de runtime de todo el agente.

## Dónde las cosas pueden terminar antes

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Enlaces](/es/automation/hooks) — scripts basados en eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de Exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Pensamiento](/es/tools/thinking) — configuración de nivel de pensamiento/razonamiento
