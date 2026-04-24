---
read_when:
    - Necesitas una explicación exacta del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando el encolado de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesiones
summary: Ciclo de vida del bucle del agente, flujos y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-04-24T05:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Bucle del agente (OpenClaw)

Un bucle agéntico es la ejecución “real” completa de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autorizada que convierte un mensaje
en acciones y una respuesta final, manteniendo al mismo tiempo el estado de la sesión coherente.

En OpenClaw, un bucle es una única ejecución serializada por sesión que emite eventos de ciclo de vida y de flujo
mientras el modelo piensa, llama herramientas y transmite la salida. Este documento explica cómo está conectado ese bucle auténtico de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida parámetros, resuelve la sesión (`sessionKey/sessionId`), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve valores predeterminados de modelo + thinking/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (entorno de ejecución pi-agent-core)
   - emite **lifecycle end/error** si el bucle incrustado no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión y una cola global
   - resuelve el perfil de autenticación y el modelo y construye la sesión Pi
   - se suscribe a eventos Pi y transmite deltas de asistente/herramienta
   - aplica el tiempo de espera -> aborta la ejecución si se supera
   - devuelve cargas útiles y metadatos de uso
4. `subscribeEmbeddedPiSession` conecta eventos de pi-agent-core con el flujo `agent` de OpenClaw:
   - eventos de herramientas => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera a **lifecycle end/error** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Encolado y concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global.
- Esto evita condiciones de carrera de herramientas/sesión y mantiene consistente el historial de sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripciones también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo
  reconoce procesos y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un auxiliar anida intencionadamente la adquisición del
  mismo bloqueo mientras conserva un único escritor lógico, debe habilitarlo explícitamente con
  `allowReentrant: true`.

## Preparación de sesión y espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo de sandbox.
- Las Skills se cargan (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el informe del system prompt.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura, Compaction o truncamiento de transcripción debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt y system prompt

- El system prompt se construye a partir del prompt base de OpenClaw, el prompt de Skills, el contexto de bootstrap y las anulaciones por ejecución.
- Se aplican los límites específicos del modelo y los tokens reservados de Compaction.
- Consulta [System prompt](/es/concepts/system-prompt) para ver lo que ve el modelo.

## Puntos de enganche (dónde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts orientados a eventos para comandos y eventos del ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y la canalización de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos de bootstrap antes de finalizar el system prompt.
  Úsalo para añadir o eliminar archivos de contexto de bootstrap.
- **Hooks de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comandos (consulta la documentación de Hooks).

Consulta [Hooks](/es/automation/hooks) para ver configuración y ejemplos.

### Hooks de Plugin (ciclo de vida de agente + Gateway)

Estos se ejecutan dentro del bucle del agente o de la canalización de Gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para anular de forma determinista proveedor/modelo antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y campos de contexto del sistema para guía estable que deba estar en el espacio del system prompt.
- **`before_agent_start`**: hook heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de acciones en línea y antes de la llamada al LLM, permitiendo a un Plugin reclamar el turno y devolver una respuesta sintética o silenciar completamente el turno.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución tras la finalización.
- **`before_compaction` / `after_compaction`**: observan o anotan ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: interceptan parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos de análisis integrados y opcionalmente bloquea instalaciones de Skills o Plugin.
- **`tool_result_persist`**: transforma sincrónicamente resultados de herramientas antes de escribirlos en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes y salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de la sesión.
- **`gateway_start` / `gateway_stop`**: eventos del ciclo de vida de Gateway.

Reglas de decisión de hooks para protecciones salientes/de herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal y detiene los controladores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal y detiene los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Consulta [Hooks de Plugin](/es/plugins/architecture-internals#provider-runtime-hooks) para ver la API de hooks y los detalles de registro.

Los harnesses pueden adaptar estos hooks de forma distinta. El harness de app-server de Codex mantiene
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo separado de menor nivel propio de Codex.

## Streaming y respuestas parciales

- Los deltas del asistente se transmiten desde pi-agent-core y se emiten como eventos `assistant`.
- El streaming por bloques puede emitir respuestas parciales ya sea en `text_end` o en `message_end`.
- El streaming de razonamiento puede emitirse como un flujo separado o como respuestas por bloques.
- Consulta [Streaming](/es/concepts/streaming) para ver el comportamiento de fragmentación y respuestas por bloques.

## Ejecución de herramientas y herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramientas se emiten en el flujo `tool`.
- Los resultados de herramientas se sanean respecto a tamaño y cargas útiles de imagen antes de registrar/emitar.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado y supresión de respuestas

- Las cargas útiles finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes de herramientas en línea (cuando `verbose` + permitido)
  - texto de error del asistente cuando falla el modelo
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de las
  cargas útiles salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de cargas útiles.
- Si no quedan cargas útiles renderizables y una herramienta falló, se emite
  una respuesta de reserva de error de herramienta (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction y reintentos

- La Compaction automática emite eventos de flujo `compaction` y puede activar un reintento.
- En un reintento, los búferes en memoria y los resúmenes de herramientas se restablecen para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para ver la canalización de Compaction.

## Flujos de eventos (actualmente)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como alternativa por `agentCommand`)
- `assistant`: deltas en streaming desde pi-agent-core
- `tool`: eventos de herramientas en streaming desde pi-agent-core

## Gestión de canales de chat

- Los deltas del asistente se almacenan en búfer en mensajes `delta` de chat.
- Se emite un `final` de chat en **lifecycle end/error**.

## Tiempos de espera

- `agent.wait` predeterminado: 30 s (solo la espera). El parámetro `timeoutMs` lo anula.
- Tiempo de ejecución del agente: `agents.defaults.timeoutSeconds` predeterminado 172800 s (48 horas); se aplica en el temporizador de aborto de `runEmbeddedPiAgent`.
- Tiempo de espera por inactividad del LLM: `agents.defaults.llm.idleTimeoutSeconds` aborta una solicitud al modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. Establécelo explícitamente para modelos locales lentos o proveedores de razonamiento/llamadas a herramientas; establécelo en 0 para desactivarlo. Si no se establece, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado, o 120 s en caso contrario. Las ejecuciones activadas por Cron sin tiempo de espera explícito de LLM o agente desactivan el guardián de inactividad y dependen del tiempo de espera externo de Cron.

## Dónde pueden terminar antes de tiempo

- Tiempo de espera del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene al agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas disponibles del agente
- [Hooks](/es/automation/hooks) — scripts orientados a eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de ejecución](/es/tools/exec-approvals) — barreras de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración del nivel de thinking/razonamiento
