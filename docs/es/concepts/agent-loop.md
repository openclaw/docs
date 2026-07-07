---
read_when:
    - Necesitas una guía paso a paso exacta del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolamiento de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesiones
summary: Ciclo de vida del bucle de agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-07-06T21:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd171ab1f8defa4c3e65305786fb247bb37379471876f29da52a46ade9fa2699
    source_path: concepts/agent-loop.md
    workflow: 16
---

El bucle del agente es la ejecución serializada, por sesión, que convierte un mensaje en
acciones y una respuesta: recepción, ensamblaje de contexto, inferencia del modelo, ejecución de
herramientas, streaming y persistencia.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: `openclaw agent`.

## Secuencia de ejecución

1. La RPC `agent` valida los parámetros, resuelve la sesión (`sessionKey`/`sessionId`), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` de inmediato.
2. `agentCommand` ejecuta el turno: resuelve los valores predeterminados de modelo + razonamiento/verbosidad/traza, carga la instantánea de Skills, llama a `runEmbeddedAgent` y emite un **fin/error de ciclo de vida** de reserva si el bucle embebido aún no emitió uno.
3. `runEmbeddedAgent`: serializa las ejecuciones mediante colas por sesión y globales, resuelve el modelo + perfil de autenticación, crea la sesión de OpenClaw, se suscribe a eventos de runtime, transmite deltas del asistente/herramienta, aplica el tiempo límite de ejecución (abortando al vencer) y devuelve payloads junto con metadatos de uso. Para turnos de app-server de Codex también aborta un turno aceptado que deja de producir progreso de app-server antes de un evento terminal.
4. `subscribeEmbeddedAgentSession` conecta los eventos de runtime con el stream `agent`: eventos de herramienta a `stream: "tool"`, deltas del asistente a `stream: "assistant"`, eventos de ciclo de vida a `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) espera el **fin/error de ciclo de vida** en un `runId` y devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Colas y concurrencia

Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global, lo que evita carreras de herramientas/sesión. Los canales de mensajería eligen un modo de cola (steer/followup/collect/interrupt) que alimenta este sistema de carriles; consulta [Cola de comandos](/es/concepts/queue).

Las escrituras de transcripción también se protegen con un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es consciente del proceso y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de otro proceso. Los escritores esperan hasta `session.writeLock.acquireTimeoutMs` (predeterminado `60000` ms; override de entorno `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) antes de informar que la sesión está ocupada.

Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Un helper que anida intencionalmente la adquisición del mismo bloqueo mientras conserva un único escritor lógico debe habilitarlo con `allowReentrant: true`.

## Preparación de sesión y espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo de sandbox.
- Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión y `SessionManager` se abre y prepara antes de que empiece el streaming. Cualquier ruta posterior de reescritura, Compaction o truncamiento de transcripción debe tomar el mismo bloqueo antes de abrir o mutar el archivo de transcripción.

## Ensamblaje del prompt

El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y los overrides por ejecución. Se aplican límites específicos del modelo y tokens de reserva para Compaction. Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver qué recibe el modelo.

## Enlaces

OpenClaw tiene dos sistemas de enlaces:

- **Enlaces internos** (enlaces de Gateway): scripts orientados a eventos para comandos y eventos de ciclo de vida.
- **Enlaces de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de Gateway.

### Enlaces internos (enlaces de Gateway)

- **`agent:bootstrap`**: se ejecuta al crear archivos de bootstrap antes de que se finalice el prompt del sistema. Úsalo para añadir o eliminar archivos de contexto de bootstrap.
- **Enlaces de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comando (consulta la documentación de Enlaces).

Consulta [Enlaces](/es/automation/hooks) para configuración y ejemplos.

### Enlaces de Plugin

Se ejecutan dentro del bucle del agente o la canalización de Gateway:

| Enlace                                                  | Se ejecuta                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Antes de la sesión (sin `messages`), para sobrescribir determinísticamente el proveedor/modelo antes de la resolución.                                                                                                                                                                      |
| `before_prompt_build`                                   | Después de cargar la sesión (con `messages`), para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío. Usa `prependContext` para texto dinámico por turno y los campos de contexto del sistema para orientación estable que pertenece al espacio del prompt del sistema. |
| `before_agent_start`                                    | Enlace de compatibilidad legado que puede ejecutarse en cualquiera de las fases; prefiere los enlaces explícitos anteriores.                                                                                                                                                                |
| `before_agent_reply`                                    | Después de las acciones inline, antes de la llamada al LLM. Permite que un Plugin reclame el turno y devuelva una respuesta sintética o lo silencie por completo.                                                                                                                           |
| `agent_end`                                             | Después de completarse, con la lista final de mensajes y metadatos de ejecución.                                                                                                                                                                                                            |
| `before_compaction` / `after_compaction`                | Observa o anota ciclos de Compaction.                                                                                                                                                                                                                                                       |
| `before_tool_call` / `after_tool_call`                  | Intercepta parámetros/resultados de herramientas.                                                                                                                                                                                                                                           |
| `before_install`                                        | Después de que se ejecute la política de instalación del operador, sobre material preparado de instalación de skill/Plugin, cuando los enlaces de Plugin están cargados en el proceso actual.                                                                                               |
| `tool_result_persist`                                   | Transforma sincrónicamente los resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.                                                                                                                                                     |
| `message_received` / `message_sending` / `message_sent` | Enlaces de mensajes entrantes y salientes.                                                                                                                                                                                                                                                  |
| `session_start` / `session_end`                         | Límites del ciclo de vida de la sesión.                                                                                                                                                                                                                                                     |
| `gateway_start` / `gateway_stop`                        | Eventos del ciclo de vida de Gateway.                                                                                                                                                                                                                                                       |

Reglas de decisión de enlaces para guardas de salida/herramienta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los manejadores de menor prioridad. `{ block: false }` es un no-op y no elimina un bloqueo previo.
- `before_install`: mismas semánticas terminal/no-op que arriba. Usa `security.installPolicy`, no `before_install`, para decisiones de permitir/bloquear instalaciones propiedad del operador que deben cubrir rutas de instalación y actualización de CLI.
- `message_sending`: `{ cancel: true }` es terminal y detiene los manejadores de menor prioridad. `{ cancel: false }` es un no-op y no elimina una cancelación previa.

Consulta [Enlaces de Plugin](/es/plugins/hooks) para la API de enlaces y los detalles de registro.

Los arneses pueden adaptar estos enlaces. El arnés de app-server de Codex mantiene los enlaces de Plugin de OpenClaw como contrato de compatibilidad para superficies espejadas documentadas; los enlaces nativos de Codex son un mecanismo separado de Codex, de nivel más bajo.

## Streaming

- Los deltas del asistente se transmiten desde el runtime del agente como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales en `text_end` o `message_end`.
- El streaming de razonamiento puede ser un stream separado o respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuesta por bloques.

## Ejecución de herramientas

- Los eventos de inicio/actualización/fin de herramienta se emiten en el stream `tool`.
- Los resultados de herramientas se limpian por tamaño y payloads de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Moldeado de respuestas

Los payloads finales se ensamblan a partir del texto del asistente (más razonamiento opcional), resúmenes de herramientas inline (cuando la verbosidad está habilitada y permitida) y texto de error del asistente cuando el modelo falla.

- El token silencioso exacto `NO_REPLY` se filtra de los payloads salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de payloads.
- Si no quedan payloads renderizables y una herramienta produjo un error, se emite una respuesta de error de herramienta de reserva salvo que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario.

## Compaction y reintentos

La Compaction automática emite eventos de stream `compaction` y puede activar un reintento. En el reintento, los búferes en memoria y los resúmenes de herramientas se reinician para evitar salida duplicada. Consulta [Compaction](/es/concepts/compaction).

## Streams de eventos

- `lifecycle`: emitido por `subscribeEmbeddedAgentSession` (y como reserva por `agentCommand`).
- `assistant`: deltas transmitidos desde el runtime del agente.
- `tool`: eventos de herramienta transmitidos desde el runtime del agente.

Gateway proyecta eventos de ciclo de vida y eventos de inicio/terminales de herramientas en el
[libro de auditoría](/cli/audit) acotado y solo de metadatos. Esta proyección registra procedencia y
códigos de resultado sin copiar prompts, mensajes, argumentos de herramientas, resultados de herramientas
ni errores sin procesar fuera de la ruta de transcripción/runtime.

## Manejo de canales de chat

Los deltas del asistente se almacenan en búfer como mensajes `delta` de chat. Se emite un `final` de chat en **fin/error de ciclo de vida**.

## Tiempos límite

| Tiempo de espera                                | Predeterminado                                              | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | Solo espera; el parámetro `timeoutMs` lo sobrescribe. No detiene la ejecución subyacente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Runtime del agente (`agents.defaults.timeoutSeconds`) | 172800s (48h)                                               | Aplicado por el temporizador de cancelación de `runEmbeddedAgent`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Turno de agente aislado de Cron                  | propiedad de cron                                           | El programador inicia su propio temporizador cuando comienza la ejecución, cancela la ejecución en la fecha límite configurada y luego ejecuta una limpieza acotada antes de registrar el tiempo de espera para que una sesión secundaria obsoleta no pueda dejar el carril bloqueado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Tiempo de espera por inactividad del modelo      | `agents.defaults.timeoutSeconds`, limitado a 120s de forma predeterminada | OpenClaw cancela una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` amplía este monitor de inactividad para proveedores locales/autohospedados lentos, pero sigue limitado por cualquier valor inferior de `agents.defaults.timeoutSeconds` o tiempo de espera específico de la ejecución, ya que estos rigen toda la ejecución del agente. Las ejecuciones de modelos en la nube activadas por Cron sin tiempo de espera explícito de modelo/agente usan el mismo valor predeterminado; con un tiempo de espera explícito de ejecución de Cron, los bloqueos del stream del modelo en la nube se limitan a 60s para que los fallbacks de modelo configurados aún puedan ejecutarse antes de la fecha límite externa de Cron. Las ejecuciones de modelos locales/autohospedados activadas por Cron desactivan el monitor implícito salvo que se configure un tiempo de espera explícito; define `models.providers.<id>.timeoutSeconds` para proveedores locales lentos. |
| Tiempo de espera de solicitud HTTP del proveedor | `models.providers.<id>.timeoutSeconds`                      | Cubre conexión, encabezados, cuerpo, tiempo de espera de solicitud del SDK, manejo de cancelación de guarded-fetch y el monitor de inactividad del stream del modelo para ese proveedor. Úsalo para proveedores locales/autohospedados lentos (por ejemplo, Ollama) antes de aumentar el tiempo de espera de todo el runtime del agente; mantén el tiempo de espera del agente/runtime al menos igual de alto cuando la solicitud de modelo necesite ejecutarse durante más tiempo.                                                                                                                                                                                                                                                                                        |

### Diagnóstico de sesiones atascadas

Con el diagnóstico activado, `diagnostics.stuckSessionWarnMs` (valor predeterminado `120000` ms) clasifica las sesiones `processing` largas sin respuesta, herramienta, estado, bloqueo ni progreso de ACP observados:

- Las ejecuciones incrustadas activas, las llamadas de modelo y las llamadas de herramienta se notifican como `session.long_running`. Las llamadas de modelo silenciosas con propietario permanecen como `session.long_running` hasta `diagnostics.stuckSessionAbortMs` para que los proveedores lentos o sin stream no se marquen como bloqueados demasiado pronto.
- El trabajo activo sin progreso reciente se notifica como `session.stalled`. Las llamadas de modelo con propietario cambian a `session.stalled` en el umbral de cancelación o después; la actividad obsoleta de modelo/herramienta sin propietario no se oculta como de larga duración.
- `session.stuck` se reserva para la contabilidad recuperable de sesiones obsoletas, incluidas las sesiones en cola inactivas con actividad obsoleta de modelo/herramienta sin propietario.

`diagnostics.stuckSessionAbortMs` tiene un valor predeterminado de al menos 5 minutos y 3 veces el umbral de advertencia. La contabilidad de sesiones obsoletas libera el carril de la sesión afectada inmediatamente después de que pasen las puertas de recuperación; las ejecuciones incrustadas bloqueadas solo se drenan mediante cancelación después del umbral de cancelación, por lo que el trabajo en cola se reanuda sin cortar ejecuciones meramente lentas. La recuperación emite resultados estructurados solicitados/completados; el estado de diagnóstico se marca como inactivo solo si la misma generación de procesamiento sigue siendo la actual, y los diagnósticos `session.stuck` repetidos aplican backoff mientras la sesión permanece sin cambios.

## Dónde las cosas pueden terminar antes

- Tiempo de espera del agente (cancelación)
- AbortSignal (cancelar)
- Desconexión de Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) - herramientas de agente disponibles
- [Hooks](/es/automation/hooks) - scripts basados en eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) - cómo se resumen las conversaciones largas
- [Aprobaciones de Exec](/es/tools/exec-approvals) - puertas de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) - configuración del nivel de pensamiento/razonamiento
