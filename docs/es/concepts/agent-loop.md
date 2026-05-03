---
read_when:
    - Necesitas una guía paso a paso exacta del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando la puesta en cola de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesiones
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-05-03T21:29:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: ingesta → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, mientras mantiene coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de flujo
mientras el modelo piensa, llama herramientas y transmite la salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida parámetros, resuelve la sesión (sessionKey/sessionId), persiste metadatos de sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve los valores predeterminados de modelo + pensamiento/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle incrustado no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica timeout -> aborta la ejecución si se supera
   - para turnos del servidor de aplicación Codex, aborta un turno aceptado que deja de producir progreso del servidor de aplicación antes de un evento terminal
   - devuelve payloads + metadatos de uso
4. `subscribeEmbeddedPiSession` conecta eventos de pi-agent-core al flujo `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera el **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y, opcionalmente, a través de un carril global.
- Esto evita condiciones de carrera de herramientas/sesión y mantiene coherente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso. Los escritores de transcripción de sesión esperan hasta `session.writeLock.acquireTimeoutMs`
  antes de informar que la sesión está ocupada; el valor predeterminado es `60000` ms.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo preservando un único escritor lógico, debe optar explícitamente por
  `allowReentrant: true`.

## Preparación de sesión + workspace

- El workspace se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de workspace de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de arranque/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura de transcripción, Compaction o truncamiento debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de arranque y las anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens reservados para Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver qué recibe el modelo.

## Puntos de hook (donde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts dirigidos por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de arranque antes de que se finalice el prompt del sistema.
  Usa esto para añadir/eliminar archivos de contexto de arranque.
- **Hooks de comando**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta el documento de Hooks).

Consulta [Hooks](/es/automation/hooks) para la configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + Gateway)

Se ejecutan dentro del bucle del agente o la canalización de Gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular determinísticamente el proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para orientación estable que deba residir en el espacio del prompt del sistema.
- **`before_agent_start`**: hook heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones inline y antes de la llamada al LLM, lo que permite a un Plugin reclamar el turno y devolver una respuesta sintética o silenciar el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución tras la finalización.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y, opcionalmente, bloquea instalaciones de Skills o plugins.
- **`tool_result_persist`**: transforma de forma síncrona los resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida de Gateway.

Reglas de decisión de hooks para protecciones de salida/herramienta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` no realiza ninguna acción y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene los handlers de menor prioridad.
- `before_install`: `{ block: false }` no realiza ninguna acción y no borra un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene los handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` no realiza ninguna acción y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los arneses pueden adaptar estos hooks de forma diferente. El arnés del servidor de aplicación Codex mantiene
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo de Codex de nivel inferior separado.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un flujo separado o como respuestas de bloque.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas de bloque.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el flujo `tool`.
- Los resultados de herramientas se sanealizan por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado de respuestas + supresión

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes inline de herramientas (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los payloads
  salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta tuvo un error, se emite una respuesta alternativa de error de herramienta
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de flujo `compaction` y puede activar un reintento.
- En el reintento, los buffers en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la canalización de Compaction.

## Flujos de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como alternativa por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramienta transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en buffer como mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado 172800 s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: `timeoutSeconds` de turno de agente aislado pertenece a Cron. El programador inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en la fecha límite configurada y luego ejecuta una limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar el carril atascado.
- Diagnósticos de vivacidad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen respuesta, herramienta, estado, bloque o progreso ACP observado. Las ejecuciones incrustadas activas, llamadas al modelo y llamadas a herramientas se informan como `session.long_running`; el trabajo activo sin progreso reciente se informa como `session.stalled`; `session.stuck` se reserva para la contabilidad de sesiones obsoletas sin trabajo activo. La contabilidad de sesiones obsoletas libera inmediatamente el carril de sesión afectado; las ejecuciones incrustadas estancadas solo se abortan y drenan tras una ventana extendida sin progreso (al menos 10 minutos y 5x el umbral de advertencia) para que el trabajo en cola pueda reanudarse sin cortar ejecuciones meramente lentas. Los diagnósticos `session.stuck` repetidos aplican backoff mientras la sesión permanece sin cambios.
- Timeout de inactividad del modelo: OpenClaw aborta una solicitud al modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s de forma predeterminada. Las ejecuciones activadas por Cron sin timeout explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de Cron.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las solicitudes HTTP de modelo de ese proveedor, incluyendo conexión, headers, body, timeout de solicitud del SDK, manejo total de aborto guarded-fetch y watchdog de inactividad del flujo del modelo. Usa esto para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout de runtime de todo el agente.

## Dónde las cosas pueden terminar antes

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts dirigidos por eventos activados por eventos de ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen conversaciones largas
- [Aprobaciones de ejecución](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Pensamiento](/es/tools/thinking) — configuración del nivel de pensamiento/razonamiento
