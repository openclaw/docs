---
read_when:
    - Necesitas una guía paso a paso exacta del bucle del agente o de los eventos del ciclo de vida
    - Está cambiando la puesta en cola de sesiones, las escrituras de transcripción o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-04-30T05:36:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, manteniendo coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de stream
mientras el modelo piensa, llama a herramientas y transmite salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida parámetros, resuelve la sesión (sessionKey/sessionId), persiste los metadatos de sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve los valores predeterminados de modelo + thinking/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica timeout -> aborta la ejecución si se supera
   - devuelve payloads + metadatos de uso
4. `subscribeEmbeddedPiSession` puentea eventos de pi-agent-core al stream `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente a través de un carril global.
- Esto evita carreras de herramientas/sesión y mantiene coherente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcript también están protegidas por un bloqueo de escritura de sesión sobre el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivos, por lo que detecta escritores que omiten la cola en proceso o vienen de
  otro proceso.
- Los bloqueos de escritura de sesión no son reentrantes por defecto. Si un helper anida intencionadamente la adquisición del
  mismo bloqueo mientras preserva un único escritor lógico, debe optar explícitamente por
  `allowReentrant: true`.

## Preparación de sesión + workspace

- El workspace se resuelve y crea; las ejecuciones en sandbox pueden redirigirse a una raíz de workspace de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven e inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y prepara antes del streaming. Cualquier
  ruta posterior de reescritura de transcript, Compaction o truncamiento debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcript.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y las anulaciones por ejecución.
- Se aplican límites específicos del modelo y tokens reservados para Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para saber qué ve el modelo.

## Puntos de hook (dónde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts impulsados por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida de agente/herramienta y la pipeline de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de bootstrap antes de finalizar el prompt del sistema.
  Úsalo para añadir/eliminar archivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta el documento de Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + gateway)

Estos se ejecutan dentro del bucle del agente o la pipeline de gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular de forma determinista el proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para orientación estable que debe residir en el espacio del prompt del sistema.
- **`before_agent_start`**: hook heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de acciones inline y antes de la llamada al LLM, lo que permite a un Plugin reclamar el turno y devolver una respuesta sintética o silenciar el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completar.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y, opcionalmente, bloquea instalaciones de Skills o Plugin.
- **`tool_result_persist`**: transforma de forma síncrona resultados de herramientas antes de que se escriban en un transcript de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de sesión.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida de gateway.

Reglas de decisión de hooks para guardas salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene handlers de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no borra un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene handlers de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los harnesses pueden adaptar estos hooks de forma diferente. El harness app-server de Codex mantiene
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies espejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo de Codex separado de menor nivel.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales ya sea en `text_end` o en `message_end`.
- El streaming de razonamiento puede emitirse como un stream separado o como respuestas en bloque.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas en bloque.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramienta se emiten en el stream `tool`.
- Los resultados de herramientas se saneanel por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Formato de respuesta + supresión

- Los payloads finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas inline (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de los payloads
  salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta produjo un error, se emite una respuesta de error de herramienta de reserva
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En el reintento, los buffers en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la pipeline de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como reserva por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramienta transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en buffers como mensajes `delta` de chat.
- Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Timeouts

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: `agents.defaults.timeoutSeconds` predeterminado 172800 s (48 horas); se aplica en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: el `timeoutSeconds` de turno de agente aislado pertenece a cron. El scheduler inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en el plazo configurado y luego ejecuta limpieza acotada antes de registrar el timeout para que una sesión hija obsoleta no pueda dejar atascado el carril.
- Recuperación de sesión atascada: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` detecta sesiones `processing` largas. Las ejecuciones embebidas activas, operaciones de respuesta activas y tareas activas de carril de sesión permanecen solo como advertencias por defecto; si los diagnósticos no muestran trabajo activo para la sesión, el watchdog libera el carril de sesión afectado para que el trabajo de arranque en cola pueda drenarse.
- Timeout de inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s por defecto. Las ejecuciones activadas por Cron sin timeout explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del timeout externo de cron.
- Timeout de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las fetches HTTP de modelo de ese proveedor, incluyendo conexión, headers, cuerpo, timeout de solicitud del SDK, manejo total de aborto de guarded-fetch y watchdog de inactividad del stream del modelo. Usa esto para proveedores locales/autohospedados lentos como Ollama antes de aumentar el timeout completo del runtime del agente.

## Dónde las cosas pueden terminar antes

- Timeout del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o timeout de RPC
- Timeout de `agent.wait` (solo espera, no detiene al agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas disponibles del agente
- [Hooks](/es/automation/hooks) — scripts impulsados por eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen conversaciones largas
- [Aprobaciones de exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración del nivel de pensamiento/razonamiento
