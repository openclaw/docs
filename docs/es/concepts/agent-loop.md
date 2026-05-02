---
read_when:
    - Necesita un recorrido exacto del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando la puesta en cola de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-05-02T05:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: ingesta → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autorizada que convierte un mensaje
en acciones y una respuesta final, mientras mantiene coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de stream
mientras el modelo razona, llama a herramientas y transmite la salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. La RPC `agent` valida los parámetros, resuelve la sesión (sessionKey/sessionId), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve los valores predeterminados de modelo + razonamiento/verbosidad/traza
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica el tiempo límite -> aborta la ejecución si se excede
   - para turnos del app-server de Codex, aborta un turno aceptado que deja de producir progreso de app-server antes de un evento terminal
   - devuelve payloads + metadatos de uso
4. `subscribeEmbeddedPiSession` conecta eventos de pi-agent-core con el stream `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas de asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global.
- Esto evita carreras de herramienta/sesión y mantiene coherente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripción también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras conserva un único escritor lógico, debe optar explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + workspace

- El workspace se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de workspace de sandbox.
- Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura de transcripción, Compaction o truncamiento debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y las sobreescrituras por ejecución.
- Se aplican los límites específicos del modelo y los tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver lo que recibe el modelo.

## Puntos de hook (donde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts impulsados por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida de agente/herramienta y el pipeline de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta al construir archivos de bootstrap antes de finalizar el prompt del sistema.
  Úsalo para agregar/eliminar archivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta el documento de Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + Gateway)

Estos se ejecutan dentro del bucle del agente o del pipeline de Gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para sobrescribir de forma determinista el proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para orientación estable que debe ubicarse en el espacio del prompt del sistema.
- **`before_agent_start`**: hook de compatibilidad heredado que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de acciones inline y antes de la llamada al LLM, lo que permite que un Plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y opcionalmente bloquea instalaciones de Skills o Plugin.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de la sesión.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida de Gateway.

Reglas de decisión de hooks para protecciones salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` es una operación sin efecto y no elimina un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_install`: `{ block: false }` es una operación sin efecto y no elimina un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` es una operación sin efecto y no elimina una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los harnesses pueden adaptar estos hooks de manera diferente. El harness del app-server de Codex conserva
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo separado de Codex de nivel inferior.

## Streaming + respuestas parciales

- Los deltas de asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming de bloques puede emitir respuestas parciales ya sea en `text_end` o en `message_end`.
- El streaming de razonamiento puede emitirse como un stream separado o como respuestas de bloque.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas de bloque.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el stream `tool`.
- Los resultados de herramientas se sanean por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Moldeado + supresión de respuestas

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes inline de herramientas (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los payloads
  salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta produjo error, se emite una respuesta alternativa de error de herramienta
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En el reintento, los búferes en memoria y los resúmenes de herramientas se reinician para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para el pipeline de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como respaldo por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramienta transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas de asistente se almacenan en búfer en mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Tiempos límite

- Valor predeterminado de `agent.wait`: 30s (solo la espera). El parámetro `timeoutMs` lo sobrescribe.
- Runtime del agente: valor predeterminado de `agents.defaults.timeoutSeconds` 172800s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: `timeoutSeconds` de turno de agente aislado pertenece a Cron. El scheduler inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en el plazo configurado y luego ejecuta una limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda mantener atascado el carril.
- Diagnósticos de vivacidad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen respuesta, herramienta, estado, bloque ni progreso de ACP observado. Las ejecuciones embebidas activas, llamadas al modelo y llamadas a herramientas se informan como `session.long_running`; el trabajo activo sin progreso reciente se informa como `session.stalled`; `session.stuck` se reserva para contabilidad de sesión obsoleta sin trabajo activo, y solo esa ruta libera el carril de sesión afectado para que el trabajo de arranque en cola pueda drenarse. Los diagnósticos `session.stuck` repetidos aplican backoff mientras la sesión permanece sin cambios.
- Tiempo límite de inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120s de forma predeterminada. Las ejecuciones disparadas por Cron sin tiempo límite explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de Cron.
- Tiempo límite de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las fetches HTTP de modelo de ese proveedor, incluidas conexión, cabeceras, cuerpo, timeout de solicitud del SDK, manejo de aborto de guarded-fetch total y watchdog de inactividad del stream del modelo. Úsalo para proveedores locales/autohospedados lentos como Ollama antes de aumentar el tiempo límite completo del runtime del agente.

## Dónde pueden terminar antes de tiempo

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts impulsados por eventos activados por eventos de ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Razonamiento](/es/tools/thinking) — configuración de nivel de pensamiento/razonamiento
