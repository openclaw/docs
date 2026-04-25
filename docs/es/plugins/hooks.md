---
read_when:
    - Estás creando un Plugin que necesita `before_tool_call`, `before_agent_reply`, hooks de mensajes o hooks del ciclo de vida
    - Necesitas bloquear, reescribir o requerir aprobación para llamadas de herramientas desde un Plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
summary: 'Hooks de Plugin: interceptar eventos del ciclo de vida del agente, la herramienta, el mensaje, la sesión y el Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw. Úsalos
cuando un Plugin necesite inspeccionar o cambiar ejecuciones del agente, llamadas de herramientas, flujo de mensajes,
ciclo de vida de la sesión, enrutamiento de subagentes, instalaciones o inicio del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y del Gateway como
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks tipados de Plugin con `api.on(...)` desde la entrada de tu Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Los controladores de hooks se ejecutan secuencialmente en orden descendente de `priority`. Los hooks con la misma prioridad
mantienen el orden de registro.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, sobrescribir o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve` — sobrescribe el proveedor o el modelo antes de que se carguen los mensajes de la sesión
- `before_prompt_build` — añade contexto dinámico o texto del prompt del sistema antes de la llamada al modelo
- `before_agent_start` — fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_reply`** — interrumpe el turno del modelo con una respuesta sintética o silencio
- `agent_end` — observa los mensajes finales, el estado de éxito y la duración de la ejecución

**Observación de la conversación**

- `model_call_started` / `model_call_ended` — observa metadatos saneados de la llamada al proveedor/modelo, temporización, resultado y hashes acotados de id de solicitud sin contenido de prompt ni respuesta
- `llm_input` — observa la entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output` — observa la salida del proveedor

**Herramientas**

- **`before_tool_call`** — reescribe parámetros de herramientas, bloquea la ejecución o requiere aprobación
- `after_tool_call` — observa resultados de herramientas, errores y duración
- **`tool_result_persist`** — reescribe el mensaje del asistente producido a partir del resultado de una herramienta
- **`before_message_write`** — inspecciona o bloquea una escritura de mensaje en progreso (poco frecuente)

**Mensajes y entrega**

- **`inbound_claim`** — reclama un mensaje entrante antes del enrutamiento al agente (respuestas sintéticas)
- `message_received` — observa contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribe el contenido saliente o cancela la entrega
- `message_sent` — observa el éxito o fallo de la entrega saliente
- **`before_dispatch`** — inspecciona o reescribe un despacho saliente antes de entregarlo al canal
- **`reply_dispatch`** — participa en el pipeline final de despacho de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end` — rastrean los límites del ciclo de vida de la sesión
- `before_compaction` / `after_compaction` — observan o anotan ciclos de Compaction
- `before_reset` — observa eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinan el enrutamiento de subagentes y la entrega de finalización

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — inician o detienen servicios propiedad del Plugin junto con el Gateway
- **`before_install`** — inspecciona análisis de instalación de Skills o plugins y puede bloquearlos

## Política de llamadas de herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` y
  `ctx.trace` de diagnóstico

Puede devolver:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Reglas:

- `block: true` es terminal y omite los controladores de menor prioridad.
- `block: false` se trata como ausencia de decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y solicita aprobación al usuario a través de las
  aprobaciones del Plugin. El comando `/approve` puede aprobar tanto aprobaciones de exec como de Plugin.
- Un `block: true` de menor prioridad todavía puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta: `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

## Hooks de prompt y modelo

Usa los hooks específicos por fase para plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y los metadatos
  de adjuntos. Devuelve `providerOverride` o `modelOverride`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de la sesión.
  Devuelve `prependContext`, `systemPrompt`, `prependSystemContext` o
  `appendSystemContext`.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu Plugin no dependa de una fase combinada heredada.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas al proveedor
que no deba recibir prompts brutos, historial, respuestas, cabeceras, cuerpos
de solicitud ni ids de solicitud del proveedor. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcional,
`durationMs`/`outcome` terminales y `upstreamRequestIdHash` cuando OpenClaw puede derivar
un hash acotado del id de solicitud del proveedor.

Los plugins no integrados que necesiten `llm_input`, `llm_output` o `agent_end` deben establecer:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Los hooks que mutan prompts pueden desactivarse por Plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooks de mensajes

Usa hooks de mensajes para políticas de enrutamiento y entrega a nivel de canal:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional con ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS de solo audio, `content` puede contener la transcripción hablada oculta
incluso cuando la carga útil del canal no tiene texto visible ni pie de medios. Reescribir ese
`content` actualiza solo la transcripción visible para hooks; no se representa como un
pie de medio.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar
metadatos específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como ausencia de decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad a menos que un hook posterior
  cancele la entrega.

## Hooks de instalación

`before_install` se ejecuta después del análisis integrado de instalaciones de Skills y plugins.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como ausencia de decisión.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios del Plugin que necesiten estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualización de Cron. Usa `gateway_stop` para limpiar recursos de larga duración.

No dependas del hook interno `gateway:startup` para servicios de tiempo de ejecución propiedad del Plugin.

## Próximas deprecaciones

Algunas superficies adyacentes a hooks están deprecadas pero siguen siendo compatibles. Migra
antes de la próxima versión mayor:

- **Sobres de canal en texto plano** en los controladores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano del sobre. Consulta
  [Sobres de canal en texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.

Para la lista completa — registro de capacidad de memoria, perfil de razonamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores del tiempo de ejecución de tareas
y el cambio de nombre `command-auth` → `command-status` — consulta
[Migración del SDK de Plugin → Deprecaciones activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) — deprecaciones activas y cronograma de eliminación
- [Creación de plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Aspectos internos de la arquitectura de Plugin](/es/plugins/architecture-internals)
