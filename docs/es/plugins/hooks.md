---
read_when:
    - Estás creando un Plugin que necesita before_tool_call, before_agent_reply, hooks de mensajes o hooks de ciclo de vida
    - Debes bloquear, reescribir o requerir aprobación para las llamadas a herramientas de un Plugin
    - Estás decidiendo entre ganchos internos y ganchos de Plugin
summary: 'Hooks de Plugin: intercepta eventos del ciclo de vida de agente, herramienta, mensaje, sesión y Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-04-30T05:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de plugins son puntos de extensión en proceso para los plugins de OpenClaw. Úsalos
cuando un plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o el arranque del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para comandos y eventos del Gateway como
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks de plugin tipados con `api.on(...)` desde la entrada de tu plugin:

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

Los manejadores de hooks se ejecutan secuencialmente en orden descendente de `priority`. Los hooks
con la misma prioridad conservan el orden de registro.

`api.on(name, handler, opts?)` acepta:

- `priority` — orden de los manejadores (los valores más altos se ejecutan primero).
- `timeoutMs` — presupuesto opcional por hook. Cuando se establece, el ejecutor de hooks aborta ese
  manejador después de que transcurre el presupuesto y continúa con el siguiente, en lugar de
  permitir que una configuración lenta o trabajo de recuperación consuma el timeout de modelo
  configurado por el llamador. Omítelo para usar el timeout predeterminado de observación/decisión que el
  ejecutor de hooks aplica de forma genérica.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. Úsala para decisiones de hooks que necesiten
opciones actuales del plugin; OpenClaw la inyecta por manejador sin mutar el
objeto de evento compartido que ven otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, sobrescribir o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve` — sobrescribe proveedor o modelo antes de que se carguen los mensajes de sesión
- `agent_turn_prepare` — consume inyecciones de turno de plugin en cola y agrega contexto del mismo turno antes de los hooks de prompt
- `before_prompt_build` — agrega contexto dinámico o texto de prompt del sistema antes de la llamada al modelo
- `before_agent_start` — fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_reply`** — interrumpe el turno del modelo con una respuesta sintética o silencio
- **`before_agent_finalize`** — inspecciona la respuesta final natural y solicita una pasada más del modelo
- `agent_end` — observa mensajes finales, estado de éxito y duración de la ejecución
- `heartbeat_prompt_contribution` — agrega contexto solo de heartbeat para monitores en segundo plano y plugins de ciclo de vida

**Observación de conversaciones**

- `model_call_started` / `model_call_ended` — observa metadatos saneados de llamadas a proveedor/modelo, tiempos, resultado y hashes acotados de id de solicitud sin contenido de prompt ni respuesta
- `llm_input` — observa entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output` — observa salida del proveedor

**Herramientas**

- **`before_tool_call`** — reescribe parámetros de herramientas, bloquea la ejecución o requiere aprobación
- `after_tool_call` — observa resultados de herramientas, errores y duración
- **`tool_result_persist`** — reescribe el mensaje del asistente producido desde un resultado de herramienta
- **`before_message_write`** — inspecciona o bloquea una escritura de mensaje en curso (poco frecuente)

**Mensajes y entrega**

- **`inbound_claim`** — reclama un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas)
- `message_received` — observa contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribe contenido saliente o cancela la entrega
- `message_sent` — observa éxito o fallo de entrega saliente
- **`before_dispatch`** — inspecciona o reescribe un despacho saliente antes de la transferencia al canal
- **`reply_dispatch`** — participa en la canalización final de despacho de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end` — registra límites del ciclo de vida de la sesión
- `before_compaction` / `after_compaction` — observa o anota ciclos de Compaction
- `before_reset` — observa eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordina el enrutamiento de subagentes y la entrega de finalización

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — inicia o detiene servicios propiedad del plugin con el Gateway
- `cron_changed` — observa cambios del ciclo de vida de Cron propiedad del gateway (agregado, actualizado, eliminado, iniciado, finalizado, programado)
- **`before_install`** — inspecciona escaneos de instalación de skills o plugins y opcionalmente bloquea

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (establecido en ejecuciones impulsadas por Cron) y `ctx.trace` de diagnóstico

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

- `block: true` es terminal y omite los manejadores de menor prioridad.
- `block: false` se trata como si no hubiera decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante aprobaciones de plugin. El comando `/approve` puede aprobar aprobaciones tanto de exec como de plugin.
- Un `block: true` de menor prioridad todavía puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta: `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

Los plugins incluidos que necesitan política de nivel de host pueden registrar políticas de herramientas de confianza
con `api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes de los hooks
`before_tool_call` ordinarios y antes de las decisiones de plugins externos. Úsalas solo
para controles de confianza del host como política de workspace, aplicación de presupuestos o
seguridad de flujos reservados. Los plugins externos deben usar hooks `before_tool_call`
normales.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de UI, diagnósticos,
enrutamiento de medios o metadatos propiedad del plugin. Trata `details` como metadatos de runtime,
no como contenido de prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción con el proveedor y la entrada de Compaction
  para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los detalles demasiado grandes se
  reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final
  de persistencia. Aun así, los hooks deben mantener pequeños los `details` devueltos y evitar
  colocar texto relevante para el prompt solo en `details`; pon la salida de herramienta visible para el modelo
  en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para nuevos plugins:

- `before_model_resolve`: recibe solo el prompt actual y metadatos de adjuntos.
  Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, mensajes de sesión preparados
  y cualquier inyección en cola exactamente una vez drenada para esta sesión. Devuelve
  `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos de heartbeat y devuelve
  `prependContext` o `appendContext`. Está pensado para monitores en segundo plano
  que necesitan resumir el estado actual sin cambiar turnos iniciados por el usuario.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu plugin no dependa de una fase combinada heredada.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.
Las ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo Cron originador) para que
los hooks de plugin puedan acotar métricas, efectos secundarios o estado a un trabajo programado
específico.

`agent_end` es un hook de observación y se ejecuta de forma fire-and-forget después del turno. El
ejecutor de hooks aplica un timeout de 30 segundos para que un plugin bloqueado o endpoint
de embeddings no pueda dejar la promesa del hook pendiente para siempre. Un timeout se registra y
OpenClaw continúa; no cancela trabajo de red propiedad del plugin a menos que el
plugin también use su propia señal de aborto.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas a proveedores
que no debe recibir prompts sin procesar, historial, respuestas, encabezados, cuerpos de solicitud
ni IDs de solicitud del proveedor. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionales,
`durationMs`/`outcome` terminales y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del id de solicitud del proveedor.

`before_agent_finalize` se ejecuta solo cuando un harness está a punto de aceptar una respuesta final
natural del asistente. No es la ruta de cancelación `/stop` y no se
ejecuta cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para pedir
al harness una pasada más del modelo antes de la finalización, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks nativos `Stop` de Codex se reenvían a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Los plugins no incluidos que necesitan `llm_input`, `llm_output`,
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

Los hooks que mutan prompts y las inyecciones duraderas para el siguiente turno pueden deshabilitarse por plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones para el siguiente turno

Los plugins de workflows pueden persistir estado de sesión pequeño compatible con JSON mediante
`api.registerSessionExtension(...)` y actualizarlo a través del método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan estado de extensión registrado
mediante `pluginExtensions`, lo que permite que Control UI y otros clientes rendericen
estado propiedad del plugin sin conocer los detalles internos del plugin.

Usa `api.enqueueNextTurnInjection(...)` cuando un plugin necesite que contexto duradero
llegue al siguiente turno del modelo exactamente una vez. OpenClaw drena inyecciones en cola antes de
los hooks de prompt, descarta inyecciones expiradas y deduplica por `idempotencyKey`
por plugin. Esta es la interfaz correcta para reanudaciones de aprobaciones, resúmenes de políticas,
deltas de monitores en segundo plano y continuaciones de comandos que deben ser visibles para
el modelo en el siguiente turno, pero no deben convertirse en texto permanente del prompt del sistema.

La semántica de limpieza forma parte del contrato. La limpieza de extensiones de sesión y los
callbacks de limpieza del ciclo de vida de runtime reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión del plugin propietario
y las inyecciones pendientes para el siguiente turno en reset/delete/disable; restart conserva
el estado duradero de sesión mientras los callbacks de limpieza permiten que los plugins liberen trabajos
del planificador, contexto de ejecución y otros recursos fuera de banda para la generación de runtime
anterior.

## Hooks de mensajes

Usa hooks de mensajes para enrutamiento de nivel de canal y política de entrega:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa éxito o fallo final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada oculta
incluso cuando la carga útil del canal no tiene texto/caption visible. Reescribir ese
`content` actualiza solo la transcripción visible para el hook; no se renderiza como
caption de medios.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos
específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como sin decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad salvo que un hook posterior
  cancele la entrega.

## Instalar hooks

`before_install` se ejecuta después del escaneo integrado para instalaciones de skill y Plugin.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como sin decisión.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios de Plugin que necesitan estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para la
inspección y actualización de cron. Usa `gateway_stop` para limpiar recursos
de larga duración.

No dependas del hook interno `gateway:startup` para servicios de runtime
propiedad del Plugin.

`cron_changed` se dispara para eventos de ciclo de vida de cron propiedad del gateway con una
carga útil de evento tipada que cubre los motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluyendo `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando está presente) además de un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos
eliminados aún llevan la instantánea del trabajo eliminado para que los programadores externos puedan
reconciliar el estado. Usa `ctx.getCron?.()` y `ctx.config` del contexto de
runtime al sincronizar programadores de activación externos, y mantén OpenClaw como la
fuente de verdad para comprobaciones de vencimiento y ejecución.

## Próximas obsolescencias

Algunas superficies adyacentes a hooks están obsoletas, pero siguen siendo compatibles. Migra
antes de la próxima versión principal:

- **Sobres de canal de texto sin formato** en manejadores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano de sobres. Consulta
  [Sobres de canal de texto sin formato → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los Plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.

Para la lista completa — registro de capacidad de memoria, perfil de pensamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores de runtime
de tareas y el cambio de nombre de `command-auth` → `command-status` — consulta
[Migración del SDK de Plugin → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) — obsolescencias activas y calendario de eliminación
- [Creación de Plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Internos de la arquitectura de Plugin](/es/plugins/architecture-internals)
