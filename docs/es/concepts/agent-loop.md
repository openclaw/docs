---
read_when:
    - Necesitas un recorrido exacto del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolado de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesión
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-07-05T11:11:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0c8c8c31ae3f821b4186f6353e2e844e12e188f142fdf4ee3cd217050c315c
    source_path: concepts/agent-loop.md
    workflow: 16
---

El bucle del agente es la ejecución serializada por sesión que convierte un mensaje en
acciones y una respuesta: recepción, ensamblaje de contexto, inferencia del modelo, ejecución de herramientas,
streaming, persistencia.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: `openclaw agent`.

## Secuencia de ejecución

1. El RPC `agent` valida los parámetros, resuelve la sesión (`sessionKey`/`sessionId`), persiste los metadatos de sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el turno: resuelve los valores predeterminados de modelo + thinking/verbose/trace, carga la instantánea de Skills, llama a `runEmbeddedAgent` y emite un **fin/error de ciclo de vida** de reserva si el bucle embebido aún no había emitido uno.
3. `runEmbeddedAgent`: serializa las ejecuciones mediante colas por sesión y globales, resuelve el perfil de modelo + autenticación, construye la sesión de OpenClaw, se suscribe a eventos de runtime, transmite deltas de asistente/herramienta, aplica el tiempo de espera de la ejecución (abortando al vencer) y devuelve cargas útiles más metadatos de uso. Para turnos del servidor de aplicaciones de Codex, también aborta un turno aceptado que deja de producir progreso del servidor de aplicaciones antes de un evento terminal.
4. `subscribeEmbeddedAgentSession` conecta los eventos de runtime con el stream de `agent`: eventos de herramientas a `stream: "tool"`, deltas de asistente a `stream: "assistant"`, eventos de ciclo de vida a `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) espera el **fin/error de ciclo de vida** en un `runId` y devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Puesta en cola y concurrencia

Las ejecuciones se serializan por clave de sesión (vía de sesión) y opcionalmente mediante una vía global, lo que evita carreras de herramientas/sesión. Los canales de mensajería eligen un modo de cola (steer/followup/collect/interrupt) que alimenta este sistema de vías; consulta [Cola de comandos](/es/concepts/queue).

Las escrituras de transcripción están protegidas además por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es consciente del proceso y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de otro proceso. Los escritores esperan hasta `session.writeLock.acquireTimeoutMs` (valor predeterminado `60000` ms; sobrescritura por env `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) antes de informar que la sesión está ocupada.

Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Un helper que anida intencionalmente la adquisición del mismo bloqueo mientras preserva un único escritor lógico debe habilitarlo con `allowReentrant: true`.

## Preparación de sesión y espacio de trabajo

- El espacio de trabajo se resuelve y crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de arranque/contexto se resuelven y se inyectan en el prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión, y `SessionManager` se abre y prepara antes de que comience el streaming. Cualquier ruta posterior de reescritura, Compaction o truncamiento de la transcripción debe tomar el mismo bloqueo antes de abrir o modificar el archivo de transcripción.

## Ensamblaje del prompt

El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de arranque y las sobrescrituras por ejecución. Se aplican los límites específicos del modelo y los tokens reservados de Compaction. Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver lo que ve el modelo.

## Hooks

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts dirigidos por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y del pipeline de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen los archivos de arranque antes de finalizar el prompt del sistema. Úsalo para agregar o quitar archivos de contexto de arranque.
- **Hooks de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comandos (consulta la documentación de Hooks).

Consulta [Hooks](/es/automation/hooks) para configuración y ejemplos.

### Hooks de Plugin

Estos se ejecutan dentro del bucle del agente o del pipeline de Gateway:

| Hook                                                    | Se ejecuta                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Pre-sesión (sin `messages`), para sobrescribir de forma determinista el proveedor/modelo antes de la resolución.                                                                                                                                                                             |
| `before_prompt_build`                                   | Después de cargar la sesión (con `messages`), para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío. Usa `prependContext` para texto dinámico por turno y los campos de contexto del sistema para guía estable que pertenece al espacio del prompt del sistema. |
| `before_agent_start`                                    | Hook de compatibilidad heredado que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.                                                                                                                                                                    |
| `before_agent_reply`                                    | Después de las acciones en línea, antes de la llamada al LLM. Permite que un Plugin reclame el turno y devuelva una respuesta sintética o la silencie por completo.                                                                                                                          |
| `agent_end`                                             | Después de completarse, con la lista final de mensajes y metadatos de ejecución.                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Observa o anota ciclos de Compaction.                                                                                                                                                                                                                                                       |
| `before_tool_call` / `after_tool_call`                  | Intercepta parámetros/resultados de herramientas.                                                                                                                                                                                                                                           |
| `before_install`                                        | Después de que se ejecuta la política de instalación del operador, sobre material de instalación de skill/plugin preparado, cuando los hooks de Plugin están cargados en el proceso actual.                                                                                                  |
| `tool_result_persist`                                   | Transforma de forma síncrona los resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.                                                                                                                                                   |
| `message_received` / `message_sending` / `message_sent` | Hooks de mensajes entrantes y salientes.                                                                                                                                                                                                                                                    |
| `session_start` / `session_end`                         | Límites del ciclo de vida de la sesión.                                                                                                                                                                                                                                                     |
| `gateway_start` / `gateway_stop`                        | Eventos del ciclo de vida de Gateway.                                                                                                                                                                                                                                                       |

Reglas de decisión de hooks para protecciones salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene handlers de menor prioridad. `{ block: false }` es un no-op y no borra un bloqueo previo.
- `before_install`: las mismas semánticas terminal/no-op que arriba. Usa `security.installPolicy`, no `before_install`, para decisiones de permitir/bloquear instalación propias del operador que deban cubrir rutas de instalación y actualización de CLI.
- `message_sending`: `{ cancel: true }` es terminal y detiene handlers de menor prioridad. `{ cancel: false }` es un no-op y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los harnesses pueden adaptar estos hooks. El harness del servidor de aplicaciones de Codex mantiene los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies espejadas documentadas; los hooks nativos de Codex son un mecanismo de Codex separado y de menor nivel.

## Streaming

- Los deltas de asistente se transmiten desde el runtime del agente como eventos `assistant`.
- El streaming de bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede ser un stream separado o bloquear respuestas.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuesta por bloques.

## Ejecución de herramientas

- Los eventos de inicio/actualización/fin de herramientas se emiten en el stream `tool`.
- Los resultados de herramientas se saneean por tamaño y cargas útiles de imagen antes de registrarlos/emitirlos.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado de respuestas

Las cargas útiles finales se ensamblan a partir del texto del asistente (más razonamiento opcional), resúmenes de herramientas en línea (cuando verbose está habilitado y permitido) y texto de error del asistente cuando el modelo produce errores.

- El token silencioso exacto `NO_REPLY` se filtra de las cargas útiles salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de cargas útiles.
- Si no quedan cargas útiles renderizables y una herramienta falló, se emite una respuesta de error de herramienta de reserva salvo que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario.

## Compaction y reintentos

La Compaction automática emite eventos de stream `compaction` y puede activar un reintento. En el reintento, los búferes en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada. Consulta [Compaction](/es/concepts/compaction).

## Streams de eventos

- `lifecycle`: emitido por `subscribeEmbeddedAgentSession` (y como reserva por `agentCommand`).
- `assistant`: deltas transmitidos desde el runtime del agente.
- `tool`: eventos de herramientas transmitidos desde el runtime del agente.

## Manejo de canales de chat

Los deltas de asistente se almacenan en búfer en mensajes `delta` de chat. Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Tiempos de espera

| Tiempo de espera                                | Predeterminado                                             | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | Solo espera; el parámetro `timeoutMs` lo sobrescribe. No detiene la ejecución subyacente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tiempo de ejecución del agente (`agents.defaults.timeoutSeconds`) | 172800s (48h)                                               | Aplicado por el temporizador de anulación de `runEmbeddedAgent`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Turno de agente aislado de Cron                  | propiedad de cron                                          | El planificador inicia su propio temporizador cuando comienza la ejecución, anula la ejecución al llegar al plazo configurado y luego ejecuta una limpieza acotada antes de registrar el tiempo de espera, para que una sesión secundaria obsoleta no pueda mantener el carril bloqueado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Tiempo de espera por inactividad del modelo      | `agents.defaults.timeoutSeconds`, limitado a 120s de forma predeterminada | OpenClaw anula una solicitud de modelo cuando no llegan fragmentos de respuesta antes de que venza la ventana de inactividad. `models.providers.<id>.timeoutSeconds` amplía este supervisor de inactividad para proveedores locales/autohospedados lentos, pero permanece acotado por cualquier valor menor de `agents.defaults.timeoutSeconds` o por un tiempo de espera específico de la ejecución, ya que estos gobiernan toda la ejecución del agente. Las ejecuciones de modelos en la nube activadas por Cron sin un tiempo de espera explícito de modelo/agente usan el mismo valor predeterminado; con un tiempo de espera explícito de ejecución de cron, los bloqueos del flujo de modelos en la nube se limitan a 60s para que las alternativas de modelo configuradas aún puedan ejecutarse antes del plazo externo de cron. Las ejecuciones de modelos locales/autohospedados activadas por Cron deshabilitan el supervisor implícito salvo que se configure un tiempo de espera explícito; configura `models.providers.<id>.timeoutSeconds` para proveedores locales lentos. |
| Tiempo de espera de solicitud HTTP del proveedor | `models.providers.<id>.timeoutSeconds`                      | Cubre la conexión, los encabezados, el cuerpo, el tiempo de espera de solicitud del SDK, el manejo de anulación de guarded-fetch y el supervisor de inactividad del flujo de modelo para ese proveedor. Úsalo para proveedores locales/autohospedados lentos (por ejemplo, Ollama) antes de aumentar el tiempo de espera de todo el tiempo de ejecución del agente; mantén el tiempo de espera del agente/tiempo de ejecución al menos tan alto cuando la solicitud del modelo necesite ejecutarse durante más tiempo.                                                                                                                                                                                                                                                                                |

### Diagnósticos de sesión bloqueada

Con los diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` (valor predeterminado `120000` ms) clasifica las sesiones `processing` largas sin respuesta, herramienta, estado, bloqueo ni progreso de ACP observados:

- Las ejecuciones incrustadas activas, las llamadas a modelos y las llamadas a herramientas se informan como `session.long_running`. Las llamadas silenciosas a modelos con propietario permanecen como `session.long_running` hasta `diagnostics.stuckSessionAbortMs`, para que los proveedores lentos o sin transmisión no se marquen como detenidos demasiado pronto.
- El trabajo activo sin progreso reciente se informa como `session.stalled`. Las llamadas a modelos con propietario cambian a `session.stalled` al llegar al umbral de anulación o después; la actividad obsoleta de modelo/herramienta sin propietario no se oculta como de larga duración.
- `session.stuck` se reserva para la contabilidad recuperable de sesiones obsoletas, incluidas las sesiones en cola inactivas con actividad obsoleta de modelo/herramienta sin propietario.

`diagnostics.stuckSessionAbortMs` tiene un valor predeterminado de al menos 5 minutos y 3 veces el umbral de advertencia. La contabilidad de sesiones obsoletas libera el carril de la sesión afectada inmediatamente después de que pasen las puertas de recuperación; las ejecuciones incrustadas detenidas se anulan y drenan solo después del umbral de anulación, para que el trabajo en cola se reanude sin interrumpir ejecuciones que simplemente son lentas. La recuperación emite resultados estructurados solicitados/completados; el estado de diagnóstico se marca como inactivo solo si la misma generación de procesamiento sigue siendo la actual, y los diagnósticos repetidos de `session.stuck` aplican una espera progresiva mientras la sesión permanece sin cambios.

## Dónde las cosas pueden terminar antes

- Tiempo de espera del agente (anulación)
- AbortSignal (cancelación)
- Desconexión del Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) - herramientas disponibles del agente
- [Hooks](/es/automation/hooks) - scripts basados en eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) - cómo se resumen las conversaciones largas
- [Aprobaciones de ejecución](/es/tools/exec-approvals) - puertas de aprobación para comandos de shell
- [Pensamiento](/es/tools/thinking) - configuración del nivel de pensamiento/razonamiento
