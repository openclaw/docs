---
read_when:
    - Necesitas una guía exacta del bucle del agente o de los eventos del ciclo de vida
    - Está cambiando la puesta en cola de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesiones
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-05-02T20:45:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Un bucle agéntico es la ejecución “real” completa de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autoritativa que convierte un mensaje
en acciones y una respuesta final, manteniendo coherente el estado de la sesión.

En OpenClaw, un bucle es una ejecución única y serializada por sesión que emite eventos de ciclo de vida y de stream
mientras el modelo piensa, llama herramientas y transmite salida. Este documento explica cómo se conecta ese bucle auténtico
de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida los parámetros, resuelve la sesión (sessionKey/sessionId), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` de inmediato.
2. `agentCommand` ejecuta el agente:
   - resuelve los valores predeterminados de modelo + pensamiento/verboso/traza
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (runtime de pi-agent-core)
   - emite **fin/error de ciclo de vida** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión + globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica tiempo de espera -> aborta la ejecución si se supera
   - para turnos del servidor de aplicaciones de Codex, aborta un turno aceptado que deja de producir progreso del servidor de aplicaciones antes de un evento terminal
   - devuelve cargas útiles + metadatos de uso
4. `subscribeEmbeddedPiSession` enlaza eventos de pi-agent-core con el stream `agent` de OpenClaw:
   - eventos de herramienta => `stream: "tool"`
   - deltas de asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera **fin/error de ciclo de vida** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Colas + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y, opcionalmente, mediante un carril global.
- Esto evita condiciones de carrera de herramientas/sesiones y mantiene coherente el historial de la sesión.
- Los canales de mensajería pueden elegir modos de cola (recopilar/dirigir/seguimiento) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripciones también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo es
  consciente del proceso y basado en archivos, por lo que detecta escritores que omiten la cola dentro del proceso o provienen de
  otro proceso. Los escritores de transcripciones de sesión esperan hasta `session.writeLock.acquireTimeoutMs`
  antes de informar que la sesión está ocupada; el valor predeterminado es `60000` ms.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un auxiliar anida intencionalmente la adquisición del
  mismo bloqueo preservando un único escritor lógico, debe optar explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + workspace

- El workspace se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de workspace de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de arranque/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura de transcripción, Compaction o truncamiento debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje de prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de arranque y las anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para saber qué ve el modelo.

## Puntos de hook (donde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts impulsados por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de arranque antes de finalizar el prompt del sistema.
  Úsalo para añadir/eliminar archivos de contexto de arranque.
- **Hooks de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comandos (consulta la documentación de Hooks).

Consulta [Hooks](/es/automation/hooks) para la configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + gateway)

Estos se ejecutan dentro del bucle del agente o de la canalización de gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular de forma determinista el proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para orientación estable que debe residir en el espacio del prompt del sistema.
- **`before_agent_start`**: hook de compatibilidad heredado que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones en línea y antes de la llamada al LLM, permitiendo que un plugin reclame el turno y devuelva una respuesta sintética o silencie el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de la finalización.
- **`before_compaction` / `after_compaction`**: observa o anota ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: intercepta parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de escaneo integrados y, opcionalmente, bloquea instalaciones de Skills o plugins.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de la sesión.
- **`gateway_start` / `gateway_stop`**: eventos del ciclo de vida de gateway.

Reglas de decisión de hooks para guardas salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` es un no-op y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene manejadores de menor prioridad.
- `before_install`: `{ block: false }` es un no-op y no borra un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` es un no-op y no borra una cancelación previa.

Consulta [Hooks de Plugin](/es/plugins/hooks) para la API de hooks y los detalles de registro.

Los arneses pueden adaptar estos hooks de forma diferente. El arnés del servidor de aplicaciones de Codex mantiene
los hooks de Plugin de OpenClaw como el contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo de Codex separado y de nivel inferior.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales ya sea en `text_end` o en `message_end`.
- El streaming de razonamiento puede emitirse como un stream separado o como respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para el comportamiento de fragmentación y respuestas por bloques.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramientas se emiten en el stream `tool`.
- Los resultados de herramientas se saneán por tamaño y cargas útiles de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado + supresión de respuestas

- Las cargas útiles finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas en línea (cuando está en modo verboso + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de las cargas útiles
  salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de cargas útiles.
- Si no quedan cargas útiles renderizables y una herramienta tuvo un error, se emite una respuesta alternativa de error de herramienta
  (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En el reintento, los búferes en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para la canalización de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como respaldo por `agentCommand`)
- `assistant`: deltas transmitidos desde pi-agent-core
- `tool`: eventos de herramientas transmitidos desde pi-agent-core

## Manejo de canales de chat

- Los deltas del asistente se almacenan en búfer en mensajes `delta` de chat.
- Se emite un `final` de chat al **fin/error de ciclo de vida**.

## Tiempos de espera

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Runtime del agente: valor predeterminado de `agents.defaults.timeoutSeconds` de 172800 s (48 horas); se aplica en el temporizador de aborto de `runEmbeddedPiAgent`.
- Runtime de Cron: `timeoutSeconds` de turnos de agente aislados pertenece a cron. El programador inicia ese temporizador cuando comienza la ejecución, aborta la ejecución subyacente en el plazo configurado y luego ejecuta una limpieza acotada antes de registrar el tiempo de espera para que una sesión hija obsoleta no pueda dejar el carril atascado.
- Diagnósticos de vivacidad de sesión: con diagnósticos habilitados, `diagnostics.stuckSessionWarnMs` clasifica sesiones `processing` largas que no tienen respuesta, herramienta, estado, bloque o progreso de ACP observado. Las ejecuciones embebidas, llamadas de modelo y llamadas de herramientas activas se informan como `session.long_running`; el trabajo activo sin progreso reciente se informa como `session.stalled`; `session.stuck` se reserva para contabilidad de sesión obsoleta sin trabajo activo, y solo esa ruta libera el carril de sesión afectado para que el trabajo de inicio en cola pueda drenarse. Los diagnósticos repetidos de `session.stuck` aplican retroceso mientras la sesión permanece sin cambios.
- Tiempo de espera por inactividad del modelo: OpenClaw aborta una solicitud de modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. `models.providers.<id>.timeoutSeconds` extiende este watchdog de inactividad para proveedores locales/autohospedados lentos; de lo contrario, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, limitado a 120 s de forma predeterminada. Las ejecuciones activadas por Cron sin tiempo de espera explícito de modelo o agente deshabilitan el watchdog de inactividad y dependen del tiempo de espera externo de Cron.
- Tiempo de espera de solicitud HTTP del proveedor: `models.providers.<id>.timeoutSeconds` se aplica a las solicitudes HTTP de fetch del modelo de ese proveedor, incluidas conexión, encabezados, cuerpo, tiempo de espera de solicitud del SDK, manejo total de aborto de fetch protegido y watchdog de inactividad de stream del modelo. Usa esto para proveedores locales/autohospedados lentos como Ollama antes de elevar el tiempo de espera de runtime de todo el agente.

## Dónde pueden terminar las cosas antes de tiempo

- Tiempo de espera del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene al agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas de agente disponibles
- [Hooks](/es/automation/hooks) — scripts impulsados por eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de Exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración de nivel de pensamiento/razonamiento
