---
read_when:
    - Estás creando un Plugin que necesita `before_tool_call`, `before_agent_reply`, hooks de mensajes o hooks de ciclo de vida
    - Necesitas bloquear, reescribir o requerir aprobación para llamadas a herramientas desde un Plugin
    - Estás decidiendo entre hooks internos y hooks de Plugins
summary: 'Hooks de Plugins: interceptar eventos del ciclo de vida del agente, herramientas, mensajes, sesión y Gateway'
title: Hooks de Plugins
x-i18n:
    generated_at: "2026-04-26T11:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Los hooks de Plugins son puntos de extensión en proceso para Plugins de OpenClaw. Úsalos
cuando un Plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o arranque del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y del Gateway como
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks de Plugins tipados con `api.on(...)` desde la entrada de tu Plugin:

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

Los hooks se agrupan por la superficie que amplían. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, sobrescribir o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve` — sobrescribe el proveedor o modelo antes de cargar los mensajes de sesión
- `before_prompt_build` — añade contexto dinámico o texto de prompt del sistema antes de la llamada al modelo
- `before_agent_start` — fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_reply`** — corta el turno del modelo con una respuesta sintética o silencio
- **`before_agent_finalize`** — inspecciona la respuesta final natural y solicita una pasada más del modelo
- `agent_end` — observa mensajes finales, estado de éxito y duración de la ejecución

**Observación de conversación**

- `model_call_started` / `model_call_ended` — observan metadatos saneados de llamadas a proveedor/modelo, tiempos, resultado y hashes acotados de ids de solicitud sin contenido de prompt ni respuesta
- `llm_input` — observa la entrada al proveedor (prompt del sistema, prompt, historial)
- `llm_output` — observa la salida del proveedor

**Herramientas**

- **`before_tool_call`** — reescribe params de herramientas, bloquea la ejecución o requiere aprobación
- `after_tool_call` — observa resultados de herramientas, errores y duración
- **`tool_result_persist`** — reescribe el mensaje del asistente producido a partir de un resultado de herramienta
- **`before_message_write`** — inspecciona o bloquea una escritura de mensaje en curso (raro)

**Mensajes y entrega**

- **`inbound_claim`** — reclama un mensaje entrante antes del enrutamiento al agente (respuestas sintéticas)
- `message_received` — observa contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribe contenido saliente o cancela la entrega
- `message_sent` — observa éxito o fallo de la entrega saliente
- **`before_dispatch`** — inspecciona o reescribe un envío saliente antes de entregarlo al canal
- **`reply_dispatch`** — participa en la canalización final de envío de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end` — rastrean límites del ciclo de vida de la sesión
- `before_compaction` / `after_compaction` — observan o anotan ciclos de Compaction
- `before_reset` — observa eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinan el enrutamiento de subagentes y la entrega de finalización

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — inician o detienen servicios propiedad del Plugin junto con el Gateway
- **`before_install`** — inspecciona análisis de instalación de Skills o Plugins y opcionalmente bloquea

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (establecido en ejecuciones impulsadas por Cron), y el `ctx.trace` de diagnóstico

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
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante
  aprobaciones del Plugin. El comando `/approve` puede aprobar tanto exec como aprobaciones de Plugins.
- Un `block: true` de menor prioridad puede seguir bloqueando después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta: `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de UI, diagnósticos,
enrutamiento multimedia o metadatos propiedad del Plugin. Trata `details` como metadatos de runtime,
no como contenido de prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción al proveedor y de la entrada de Compaction
  para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los details sobredimensionados se
  reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final
  de persistencia. Los hooks deben seguir manteniendo pequeños los `details` devueltos y evitar
  colocar texto relevante para el prompt solo en `details`; pon la salida visible por el modelo
  en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para Plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y metadatos de archivos adjuntos.
  Devuelve `providerOverride` o `modelOverride`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `systemPrompt`, `prependSystemContext` o
  `appendSystemContext`.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu Plugin no dependa de una fase combinada heredada.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.
Las ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo Cron de origen) para que
los hooks de Plugins puedan limitar métricas, efectos secundarios o estado a un trabajo
programado específico.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas al proveedor
que no deba recibir prompts, historial, respuestas, encabezados, cuerpos de solicitud ni IDs de solicitud del proveedor en bruto. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionales, terminales
`durationMs`/`outcome`, y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del id de solicitud del proveedor.

`before_agent_finalize` se ejecuta solo cuando un arnés está a punto de aceptar una
respuesta final natural del asistente. No es la ruta de cancelación `/stop` y no
se ejecuta cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para pedir
al arnés una pasada más del modelo antes de finalizar, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks nativos `Stop` de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Los Plugins no incluidos que necesiten `llm_input`, `llm_output`,
`before_agent_finalize` o `agent_end` deben establecer:

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

Usa hooks de mensajes para la política de enrutamiento y entrega a nivel de canal:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS de solo audio, `content` puede contener la transcripción hablada oculta
aunque la carga útil del canal no tenga texto/subtítulo visible. Reescribir ese
`content` actualiza solo la transcripción visible para hooks; no se renderiza como subtítulo
del contenido multimedia.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primer nivel antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como ausencia de decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad salvo que un hook posterior
  cancele la entrega.

## Hooks de instalación

`before_install` se ejecuta después del análisis integrado para instalaciones de Skills y Plugins.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como ausencia de decisión.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios del Plugin que necesiten estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de Cron. Usa `gateway_stop` para limpiar recursos de larga duración.

No dependas del hook interno `gateway:startup` para servicios de runtime propiedad de Plugins.

## Próximas desaprobaciones

Algunas superficies adyacentes a hooks están desaprobadas pero siguen siendo compatibles. Migra
antes de la próxima versión mayor:

- **Sobres de canal en texto plano** en controladores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano del sobre. Consulta
  [Sobres de canal en texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los Plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de una `string` libre.

Para la lista completa — registro de capabilities de memoria, perfil de thinking
del proveedor, proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores
de runtime de tareas y el cambio de nombre `command-auth` → `command-status` — consulta
[Migración del SDK de Plugins → Desaprobaciones activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugins](/es/plugins/sdk-migration) — desaprobaciones activas y cronograma de retirada
- [Crear Plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugins](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugins](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Internos de la arquitectura de Plugins](/es/plugins/architecture-internals)
